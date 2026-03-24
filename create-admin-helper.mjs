async function createAdmin() {
  const res = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@algorythmics.com',
      password: 'adminpassword',
      role: 'admin'
    })
  });
  const data = await res.json();
  console.log(data);
}
createAdmin();
