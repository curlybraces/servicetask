const functions = require('firebase-functions')
const admin = require('firebase-admin')

admin.initializeApp()

const firestore = admin.firestore()

exports.createCallNotification = functions.firestore.document('calls/{notificationId}').onCreate(
  async (snapshot) => {
    let call = snapshot.data()
    let tokens = await firestore.collection('tokens').doc('main').get().then(doc => {
      return doc.data().tokens
    })

    let notification = {
      title: `${call.customer}`,
      body: `${call.title}`,
      tokens: tokens
    }

    console.log(notification)

    let notifications = firestore.collection('notifications')
    notifications.add(notification)
  })

// Sends a notifications to all users when a new message is posted.
exports.sendNotifications = functions.firestore.document('notifications/{notificationId}').onCreate(
  async (snapshot) => {
    let notification = snapshot.data()
    const payload = {
      notification: {
        title: notification.title,
        body: notification.body,
        click_action: `https://${process.env.GCLOUD_PROJECT}.firebaseapp.com/dashboard`
      }
    }

    await admin.messaging().sendToDevice(notification.tokens, payload)

    return true
  })
