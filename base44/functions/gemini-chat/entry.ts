export default async function() {
  return Response.json({ error: 'هذه الوظيفة القديمة معطلة. النظام لا يستخدم أي مزود ذكاء اصطناعي خارجي.' }, { status: 410 });
}
