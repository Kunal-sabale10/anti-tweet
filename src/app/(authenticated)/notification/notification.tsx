export const initializeNotifications = async () => {
  if (!("Notification" in window)) {
    console.log("Notifications not supported");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  const permission = await Notification.requestPermission();
  return permission === "granted";
};

export const notifyTweet = (tweetContent: string) => {
  if (!("Notification" in window)) return;

  if (Notification.permission !== "granted") return;

  const text = tweetContent.toLowerCase();

  if (
    text.includes("cricket") ||
    text.includes("science")
  ) {
    new Notification("New Important Tweet", {
      body: tweetContent,
      icon: "/favicon.ico",
      tag: "tweet-notification",
    });
  }
};