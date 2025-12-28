// Supabase has been removed in favor of a self-hosted PostgreSQL backend.
// This file is kept as a placeholder to prevent import errors in other legacy files
// until they are fully refactored.

export const supabase = {
  from: () => ({
    select: () => ({
      order: () => Promise.resolve({ data: [], error: null }),
      eq: () => ({
        single: () => Promise.resolve({ data: null, error: null })
      })
    }),
    insert: () => ({
       select: () => ({
         single: () => Promise.resolve({ data: null, error: null })
       })
    })
  }),
  channel: () => ({
    on: () => ({
      subscribe: () => ({
        unsubscribe: () => {}
      })
    })
  })
};