import { getPayload } from 'payload'
import configPromise from '../payload.config'

async function seed() {
  const payload = await getPayload({ config: configPromise })

  const adminEmail = 'admin@algorythmics.com'
  const adminPassword = 'adminpassword'

  // Check if admin already exists
  const existingAdmins = await payload.find({
    collection: 'users',
    where: {
      email: {
        equals: adminEmail,
      },
    },
  })

  if (existingAdmins.totalDocs > 0) {
    console.log('Admin already exists')
    process.exit(0)
  }

  await payload.create({
    collection: 'users',
    data: {
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
    },
  })

  console.log('Admin created: ' + adminEmail + ' / ' + adminPassword)
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
