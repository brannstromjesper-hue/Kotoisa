# Supabase setup

This app now uses Supabase for auth, data, realtime updates, and image storage.

## 1. Create a Supabase project

Create a project at <https://supabase.com>, then copy:

- Project URL
- `anon` public API key

Add them to your deployment environment:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_STORAGE_BUCKET=app-images
```

For local development you can also paste them into `supabase-config.js`.

## 2. Enable email auth

In Supabase:

1. Go to **Authentication > Providers**
2. Enable **Email**
3. For easiest first setup, turn off email confirmation

The app turns usernames into internal email addresses like
`username@kotityot.app`, matching the previous Firebase behavior.

## 3. Create tables, policies, and storage bucket

Run `supabase/schema.sql` in the Supabase SQL editor.

The app uses a document-style `documents` table:

- `users/{userId}`
- `families/{familyId}`
- `families/{familyId}/recipes/{recipeId}`
- `families/{familyId}/chores/{choreId}`
- `families/{familyId}/weeklyMeals/{rowId}`
- `families/{familyId}/weeklyChores/{rowId}`
- `families/{familyId}/familyCalendar/{itemId}`
- `families/{familyId}/tags/{tagId}`

Images are stored in the public `app-images` bucket:

- `avatars/{userId}/profile`
- `families/{familyId}/recipes/{recipeId}/...`

## 4. Enable realtime

In Supabase:

1. Go to **Database > Replication**
2. Enable Realtime for the `documents` table

Without this, data still saves, but other screens may not refresh immediately.
