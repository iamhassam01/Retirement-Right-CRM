import { Client, PipelineStage, Workshop, Task, CalendarEvent, DocumentFile } from './types';
import { Users, Calendar, AlertCircle, TrendingUp } from 'lucide-react';

export const MOCK_CLIENTS: Client[] = [
  {
    id: '1',
    name: 'Robert & Martha Sterling',
    email: 'robert.sterling@example.com',
    phone: '(555) 123-4567',
    status: 'Active',
    advisor: 'John Jenkins',
    aum: 1250000,
    lastContact: 'Today',
    nextStep: 'Quarterly Review',
    pipelineStage: PipelineStage.ClientOnboarded,
    riskProfile: 'Conservative',
    tags: ['Retiree', 'High Net Worth', 'Golf'],
    imageUrl: 'https://picsum.photos/200/200?random=1',
    portfolioHealth: 'On Track',
    activities: [
      { 
        id: 'a1', 
        type: 'call', 
        subType: 'ai',
        direction: 'inbound',
        date: 'Today', 
        time: '10:42 AM',
        description: 'Client asked about RMD distribution timeline.', 
        user: 'AI Assistant',
        duration: '4m 12s',
        status: 'Completed',
        tags: ['RMD', 'Tax', 'Urgent'],
        aiAnalysis: {
          summary: [
            'Robert asked if his RMD needs to be taken by Dec 31st.',
            'Expressed concern about tax bracket implications.',
            'AI confirmed deadline and offered to schedule a tax strategy call.'
          ],
          intent: 'Compliance / Tax Question',
          sentiment: 'Concerned',
          nextAction: 'Schedule Tax Strategy Review',
          confidenceScore: 98
        },
        transcript: [
          { speaker: 'Client', text: 'Hi, I was reading about the new RMD rules. Do I need to withdraw by year-end?', time: '00:15' },
          { speaker: 'AI', text: 'Yes, Robert. For your account type, the deadline is December 31st. Would you like me to check your current withdrawal status?', time: '00:22' },
          { speaker: 'Client', text: 'Please. I don\'t want to get hit with a penalty, but I\'m worried about my tax bracket.', time: '00:35' },
          { speaker: 'AI', text: 'I see that you have distributed 60% of your required amount. To discuss the tax impact of the remaining balance, I recommend a quick chat with John. Shall I book that?', time: '00:45' },
          { speaker: 'Client', text: 'Yes, please book it for Thursday.', time: '00:55' }
        ]
      },
      { 
        id: 'a2', 
        type: 'sms', 
        subType: 'human',
        direction: 'outbound',
        date: 'Yesterday', 
        time: '4:15 PM',
        description: 'Sent Q3 Performance Report', 
        user: 'John Jenkins',
        thread: [
          { sender: 'John Jenkins', text: 'Hi Robert, just emailed your Q3 report. Great growth in the bond sector!', time: '4:15 PM', isAi: false },
          { sender: 'Robert Sterling', text: 'Thanks John, received it. Will review tonight.', time: '4:20 PM', isAi: false }
        ]
      },
      { 
        id: 'a3', 
        type: 'call', 
        subType: 'human',
        direction: 'outbound',
        date: 'Oct 24, 2023',
        time: '2:30 PM', 
        description: 'Discussed bond yield adjustments', 
        user: 'John Jenkins',
        duration: '15m 30s',
        status: 'Completed',
        tags: ['Portfolio', 'Bonds']
      }
    ]
  },
  {
    id: '2',
    name: 'Eleanor Vance',
    email: 'e.vance@example.com',
    phone: '(555) 987-6543',
    status: 'Prospect',
    advisor: 'John Jenkins',
    lastContact: 'Oct 25',
    nextStep: 'Confirm Workshop Attendance',
    pipelineStage: PipelineStage.Contacted,
    riskProfile: 'Moderate',
    tags: ['Widow', 'Estate Planning'],
    imageUrl: 'https://picsum.photos/200/200?random=2',
    activities: [
      { 
        id: 'a4', 
        type: 'call', 
        subType: 'ai',
        direction: 'outbound',
        date: 'Oct 25',
        time: '11:00 AM', 
        description: 'Workshop Invitation Follow-up', 
        user: 'AI Assistant',
        duration: '1m 45s',
        status: 'Voicemail',
        aiAnalysis: {
          summary: [
            'Called to confirm attendance for Estate Planning 101.',
            'No answer, left personalized voicemail regarding the event details.'
          ],
          intent: 'Event Confirmation',
          sentiment: 'Neutral',
          nextAction: 'Send SMS Follow-up',
          confidenceScore: 99
        }
      },
      { 
        id: 'a5', 
        type: 'sms', 
        subType: 'ai',
        direction: 'outbound',
        date: 'Oct 25', 
        time: '11:05 AM',
        description: 'Automated follow-up after voicemail', 
        user: 'AI Assistant',
        thread: [
          { sender: 'AI Assistant', text: 'Hi Eleanor, this is Retirement Right. Just checking if you can join our Estate Planning workshop on Nov 12?', time: '11:05 AM', isAi: true }
        ]
      }
    ]
  },
  {
    id: '3',
    name: 'David Chen',
    email: 'd.chen@tech.co',
    phone: '(555) 456-7890',
    status: 'Lead',
    advisor: 'Mike Ross',
    lastContact: '2023-10-26',
    nextStep: 'Schedule Initial Consult',
    pipelineStage: PipelineStage.NewLead,
    tags: ['Pre-Retiree', 'Tech', 'Rollover'],
    imageUrl: 'https://picsum.photos/200/200?random=3',
    activities: []
  },
  {
    id: '4',
    name: 'Judith & Harold Finch',
    email: 'finch.family@example.com',
    phone: '(555) 222-3333',
    status: 'Active',
    advisor: 'John Jenkins',
    aum: 3400000,
    lastContact: '2023-10-15',
    nextStep: 'Sign Trust Documents',
    pipelineStage: PipelineStage.Proposal,
    riskProfile: 'Moderate',
    tags: ['Business Owner', 'Trust'],
    imageUrl: 'https://picsum.photos/200/200?random=4',
    portfolioHealth: 'Review Needed',
    activities: []
  }
];

export const MOCK_WORKSHOPS: Workshop[] = [
  { id: 'w1', title: 'Maximizing Social Security', date: 'Nov 12, 2023', registered: 14, capacity: 20, status: 'Upcoming' },
  { id: 'w2', title: 'Estate Planning 101', date: 'Oct 15, 2023', registered: 18, capacity: 20, status: 'Completed' },
  { id: 'w3', title: 'Tax-Efficient Withdrawal Strategies', date: 'Dec 05, 2023', registered: 5, capacity: 25, status: 'Draft' },
];

export const MOCK_TASKS: Task[] = [
  { id: 't1', title: 'Call regarding RMD distribution', due: 'Today', type: 'Call', priority: 'High', clientName: 'Robert Sterling' },
  { id: 't2', title: 'Prepare Q3 Report', due: 'Tomorrow', type: 'Prep', priority: 'Medium', clientName: 'Judith Finch' },
  { id: 't3', title: 'Follow up on seminar invite', due: 'Oct 30', type: 'Follow-up', priority: 'Low', clientName: 'Eleanor Vance' },
];

export const KPI_STATS = [
  { label: 'Total AUM', value: '$42.5M', change: '+2.4%', isPositive: true, icon: TrendingUp },
  { label: 'Active Clients', value: '124', change: '+3', isPositive: true, icon: Users },
  { label: 'Appointments Today', value: '4', icon: Calendar },
  { label: 'Pending Follow-ups', value: '7', change: '2 overdue', isPositive: false, icon: AlertCircle },
];

export const MOCK_EVENTS: CalendarEvent[] = [
  { id: 'e1', title: 'Review with Robert & Martha', start: new Date(2023, 9, 27, 10, 0), end: new Date(2023, 9, 27, 11, 30), type: 'Meeting', clientName: 'Sterling' },
  { id: 'e2', title: 'Lead Call: David Chen', start: new Date(2023, 9, 27, 14, 0), end: new Date(2023, 9, 27, 14, 30), type: 'Call', clientName: 'Chen' },
  { id: 'e3', title: 'Workshop: Social Security', start: new Date(2023, 9, 28, 18, 0), end: new Date(2023, 9, 28, 20, 0), type: 'Workshop' },
  { id: 'e4', title: 'Weekly Team Sync', start: new Date(2023, 9, 30, 9, 0), end: new Date(2023, 9, 30, 10, 0), type: 'Meeting' },
];

export const MOCK_DOCS: DocumentFile[] = [
  { id: 'd1', name: 'Sterling_Q3_Report.pdf', type: 'pdf', size: '2.4 MB', dateModified: 'Oct 24, 2023', category: 'Client' },
  { id: 'd2', name: 'Compliance_2023_Checklist.docx', type: 'doc', size: '145 KB', dateModified: 'Oct 01, 2023', category: 'Compliance' },
  { id: 'd3', name: 'Seminar_Slide_Deck.pptx', type: 'folder', size: '12 MB', dateModified: 'Sep 15, 2023', category: 'Internal' },
  { id: 'd4', name: 'Finch_Trust_Deed_Draft.pdf', type: 'pdf', size: '4.1 MB', dateModified: 'Oct 15, 2023', category: 'Client' },
  { id: 'd5', name: 'Vance_Risk_Assessment.xls', type: 'xls', size: '45 KB', dateModified: 'Oct 25, 2023', category: 'Client' },
];