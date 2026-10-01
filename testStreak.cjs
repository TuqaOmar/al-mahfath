const admin = require("firebase-admin");
const serviceAccount = require("./server/serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function run() {
  const users = await db.collection('users').get();
  users.forEach(doc => {
    console.log(doc.id, doc.data().name, doc.data().email, "Streak:", doc.data().streak, "LastActive:", doc.data().lastActiveDate);
  });
  process.exit(0);
}
run();
