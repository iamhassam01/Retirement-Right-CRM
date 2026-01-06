import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createNotification } from './notifications.controller';

const prisma = new PrismaClient();

// Helper to normalize phone numbers for comparison
const normalizePhone = (phone: string): string => {
  if (!phone) return '';
  return phone.replace(/\D/g, '').slice(-10); // Get last 10 digits
};

// --- Vapi Webhook Handler ---
// Receives call status updates and transcripts from Vapi.ai
export const handleVapiWebhook = async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    // DEBUG: Log entire incoming message structure
    console.log('=== VAPI WEBHOOK DEBUG ===');
    console.log('Message type:', message?.type);
    console.log('Has recordingUrl at message level:', !!message?.recordingUrl);
    console.log('recordingUrl value:', message?.recordingUrl);
    console.log('Has artifact.recordingUrl:', !!message?.artifact?.recordingUrl);
    console.log('Has call.recordingUrl:', !!message?.call?.recordingUrl);

    // ONLY process end-of-call-report - ignore all other message types
    // This prevents 'Call completed' spam from call-status-update, transfer-update, etc.
    if (message?.type !== 'end-of-call-report') {
      console.log('Ignoring non-end-of-call-report message type:', message?.type);
      return res.status(200).json({ received: true, ignored: true, type: message?.type });
    }

    // Vapi sends different message types: "call-status-update", "end-of-call-report", etc.
    // if (message?.type === 'end-of-call-report') { -- removed, now checked above
    const { call, analysis, transcript, recordingUrl, artifact } = message;
    const customerPhone = normalizePhone(call?.customer?.number || '');
    const callId = call?.id;

    // Check for duplicate - prevent logging same call twice
    if (callId) {
      const existingActivity = await prisma.activity.findFirst({
        where: {
          description: { contains: callId }
        }
      });
      if (existingActivity) {
        console.log('Duplicate call detected, skipping:', callId);
        return res.status(200).json({ received: true, duplicate: true });
      }
    }

    // 1. Try to find existing client by phone
    let client = await prisma.client.findFirst({
      where: {
        phone: {
          endsWith: customerPhone
        }
      }
    });

    // 2. If no client found, create a new Lead
    if (!client && customerPhone) {
      client = await prisma.client.create({
        data: {
          name: `Unknown Caller (${call?.customer?.number || 'N/A'})`,
          phone: call?.customer?.number,
          status: 'Lead',
          pipelineStage: 'New Lead'
        }
      });
      console.log('Created new Lead from unknown caller:', client.id);
    }

    // 3. Create Activity Log linked to the client
    if (client) {
      // Get messages from transcript or artifact.messages
      const rawMessages = Array.isArray(transcript) ? transcript : (artifact?.messages || []);

      // Normalize transcript format for frontend
      // FILTER OUT system messages - only keep user and bot/assistant
      const normalizedTranscript = rawMessages
        .filter((msg: any) => msg.role === 'user' || msg.role === 'bot' || msg.role === 'assistant')
        .map((msg: any) => ({
          speaker: msg.role === 'user' ? 'User' : 'AI',
          text: msg.message || msg.content || msg.text || ''
        }));

      // Get recording URL - Vapi sends at message level, not call level
      const finalRecordingUrl = recordingUrl || artifact?.recordingUrl || call?.recordingUrl || '';

      // DEBUG: Log recording URL sources
      console.log('Recording URL Debug:', {
        fromMessage: recordingUrl,
        fromArtifact: artifact?.recordingUrl,
        fromCall: call?.recordingUrl,
        final: finalRecordingUrl
      });

      // Get duration from message or calculate
      const duration = message.durationSeconds || call?.durationSeconds ||
        (message.durationMs ? Math.round(message.durationMs / 1000) : 0);

      await prisma.activity.create({
        data: {
          clientId: client.id,
          type: 'call',
          subType: 'ai',
          direction: call?.type === 'outbound' ? 'outbound' : 'inbound',
          description: analysis?.summary || `Vapi AI Call [${callId || 'unknown'}]`,
          duration: duration ? `${duration}s` : undefined,
          status: 'Completed',
          aiAnalysis: analysis || null,
          transcript: normalizedTranscript,
          recordingUrl: finalRecordingUrl
        }
      });

      // 4. Update client's last contact timestamp
      await prisma.client.update({
        where: { id: client.id },
        data: { lastContact: new Date() }
      });

      // 5. Auto-create follow-up task if AI analysis suggests a next action
      if (analysis?.nextAction && analysis.nextAction.trim()) {
        try {
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 1); // Default: due tomorrow

          // Handle summary which could be string or array
          const summaryText = Array.isArray(analysis.summary)
            ? analysis.summary.join('. ')
            : (analysis.summary || 'N/A');

          await prisma.task.create({
            data: {
              title: `Follow-up: ${analysis.nextAction.substring(0, 100)}`, // Limit title length
              description: `Auto-generated from Vapi call.\nClient: ${client.name}\nCall Summary: ${summaryText}`,
              priority: 'High',
              type: 'Follow-up',
              status: 'Pending',
              dueDate: dueDate, // Correct field name per schema
              clientId: client.id
            }
          });
          console.log('Auto-created follow-up task for client:', client.id);
        } catch (taskError) {
          console.error('Failed to create follow-up task:', taskError);
          // Don't fail the whole webhook if task creation fails
        }
      }

      console.log('Vapi Call Logged for client:', client.id);

      // 6. Create notification for the advisor (if client has one)
      if (client.advisorId) {
        await createNotification(
          client.advisorId,
          'call',
          'AI Call Completed',
          `Call with ${client.name} completed. ${analysis?.nextAction || ''}`,
          `/clients/${client.id}`
        );
      }
    } else {
      console.warn('Vapi Webhook: Could not match or create client for call');
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Vapi Webhook Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// --- n8n Webhook Handler ---
// Generic handler for n8n workflows to update CRM data
export const handleN8nWebhook = async (req: Request, res: Response) => {
  try {
    const { action, entity, data } = req.body;
    console.log('=== n8n WEBHOOK DEBUG ===');
    console.log('Action:', action);
    console.log('Entity:', entity);
    console.log('Data:', JSON.stringify(data, null, 2));

    // Example: n8n sends { action: "create", entity: "lead", data: { ... } }
    if (action === 'create' && entity === 'lead') {
      const newLead = await prisma.client.create({
        data: {
          ...data,
          status: 'Lead',
          pipelineStage: 'New Lead'
        }
      });
      return res.json({ success: true, id: newLead.id });
    }

    // Example: Update Client Status
    if (action === 'update' && entity === 'client') {
      const { id, ...updates } = data;
      const updatedClient = await prisma.client.update({
        where: { id },
        data: updates
      });
      return res.json({ success: true, client: updatedClient });
    }

    // Example: Create Event (Appointment) - Auto-assign advisor if not provided
    if (action === 'create' && entity === 'event') {
      // If no advisorId provided, find the first available advisor
      let advisorId = data.advisorId;
      if (!advisorId) {
        const availableAdvisor = await prisma.user.findFirst({
          where: { isAvailable: true },
          select: { id: true }
        });
        advisorId = availableAdvisor?.id;
      }

      const newEvent = await prisma.event.create({
        data: {
          title: data.title,
          startTime: new Date(data.startTime),
          endTime: new Date(data.endTime),
          type: data.type || 'Meeting',
          clientId: data.clientId || null,
          advisorId: advisorId || null
        }
      });
      return res.json({ success: true, id: newEvent.id });
    }

    // Reschedule Event (for Vapi reschedule_appointment via n8n)
    if (action === 'reschedule' && entity === 'event') {
      const { email, existingDate, newDate, eventId } = data;

      let event;

      // Find event by ID if provided, or by client email + date
      if (eventId) {
        event = await prisma.event.findUnique({ where: { id: eventId } });
      } else if (email && existingDate) {
        // Find client by email first
        const client = await prisma.client.findFirst({
          where: { email: email }
        });

        if (client) {
          // Find event for this client near the existing date
          const dateStart = new Date(existingDate);
          dateStart.setHours(0, 0, 0, 0);
          const dateEnd = new Date(existingDate);
          dateEnd.setHours(23, 59, 59, 999);

          event = await prisma.event.findFirst({
            where: {
              clientId: client.id,
              startTime: {
                gte: dateStart,
                lte: dateEnd
              }
            }
          });
        }
      }

      if (!event) {
        return res.status(404).json({ success: false, error: 'Event not found' });
      }

      // Update to new date (keep same time, just change date)
      const newStartTime = new Date(newDate);
      newStartTime.setHours(new Date(event.startTime).getHours(), new Date(event.startTime).getMinutes());
      const newEndTime = new Date(newDate);
      newEndTime.setHours(new Date(event.endTime).getHours(), new Date(event.endTime).getMinutes());

      const updatedEvent = await prisma.event.update({
        where: { id: event.id },
        data: {
          startTime: newStartTime,
          endTime: newEndTime,
          status: 'Rescheduled'
        }
      });

      return res.json({ success: true, event: updatedEvent, message: `Rescheduled to ${newDate}` });
    }

    // Log Message (for Vapi leave_message - creates callback task)
    if (action === 'log_message') {
      const { name, phone, reason, address, clientId } = data;

      // Find or create client
      let client;
      if (clientId) {
        client = await prisma.client.findUnique({ where: { id: clientId } });
      } else if (phone) {
        const normalizedPhone = phone.replace(/\D/g, '').slice(-10);
        client = await prisma.client.findFirst({
          where: { phone: { endsWith: normalizedPhone } }
        });

        if (!client) {
          client = await prisma.client.create({
            data: {
              name: name || 'Unknown Caller',
              phone: phone,
              status: 'Lead',
              pipelineStage: 'New Lead'
            }
          });
        }
      }

      // Create callback task
      const task = await prisma.task.create({
        data: {
          title: `Callback: ${name || 'Voicemail'}`,
          description: `Reason: ${reason || 'No reason provided'}\nAddress: ${address || 'N/A'}\nPhone: ${phone}`,
          priority: 'High',
          type: 'Call',
          status: 'Pending',
          clientId: client?.id
        }
      });

      // Log activity
      if (client) {
        await prisma.activity.create({
          data: {
            clientId: client.id,
            type: 'call',
            subType: 'voicemail',
            direction: 'inbound',
            description: `Message: ${reason || 'Voicemail left'}`,
            status: 'Pending Callback'
          }
        });
      }

      return res.json({ success: true, taskId: task.id, message: 'Message logged and callback task created' });
    }

    // Log Transfer (for Vapi transfer_call - logs the transfer activity)
    if (action === 'log_transfer') {
      const { phone, advisorName, advisorId, clientId, success } = data;

      // Find client if not provided
      let client;
      if (clientId) {
        client = await prisma.client.findUnique({ where: { id: clientId } });
      } else if (phone) {
        const normalizedPhone = phone.replace(/\D/g, '').slice(-10);
        client = await prisma.client.findFirst({
          where: { phone: { endsWith: normalizedPhone } }
        });
      }

      // Log activity
      if (client) {
        await prisma.activity.create({
          data: {
            clientId: client.id,
            type: 'call',
            subType: 'transfer',
            direction: 'inbound',
            description: `Call transferred to ${advisorName || 'advisor'}`,
            status: success ? 'Completed' : 'Failed'
          }
        });

        await prisma.client.update({
          where: { id: client.id },
          data: { lastContact: new Date() }
        });
      }

      return res.json({ success: true, message: 'Transfer logged' });
    }

    res.status(400).json({ error: 'Unknown action or entity' });
  } catch (error) {
    console.error('n8n Webhook Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
