import admin from "../../config/firebaseAdmin.js";

export const sendNotification = async (req, res) => {
  const { token, title, body } = req.body;

  try {
    const message = {
      token,

      // 🔴 WEB PUSH CONFIG (VERY IMPORTANT)
      webpush: {
        notification: {
          title,
          body,
        //   icon: "https://res.cloudinary.com/dqacezsc5/image/upload/v1754648053/logo_w7gbjw.png",
        },
      },

      // 👇 OPTIONAL (React UI ke liye)
      data: {
        title,
        body,
      },
    };

    await admin.messaging().send(message);

    res.status(200).json({
      success: true,
      message: "Notification sent successfully",
    });
  } catch (error) {
    console.error("FCM ERROR:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
