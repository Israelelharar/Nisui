import { createSessionCookie, roleForPassword } from './_lib/session.js';

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const role = roleForPassword(String(form?.get('password') ?? ''));
  if (!role) {
    return new Response(null, { status: 303, headers: { Location: '/login.html?wrong=1' } });
  }
  return new Response(null, {
    status: 303,
    headers: { Location: role === 'admin' ? '/admin' : '/', 'Set-Cookie': await createSessionCookie(role) },
  });
}
