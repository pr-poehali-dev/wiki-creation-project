import { useEffect } from "react";
import { API_URLS } from "@/config/api";

export const useAdminActivity = (email: string, nickname: string) => {
  useEffect(() => {
    if (!email) return;

    const sendHeartbeat = async () => {
      try {
        await fetch(API_URLS.ADMIN_ACTIVITY, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            nickname,
            action: "heartbeat",
          }),
        });
      } catch (error) {
        console.error('Failed to send heartbeat', error);
      }
    };

    const sendLoginEvent = async () => {
      try {
        await fetch(API_URLS.ADMIN_ACTIVITY, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            nickname,
            action: "login",
          }),
        });
      } catch (error) {
        console.error('Failed to send login event', error);
      }
    };

    sendLoginEvent();

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 30000);

    return () => clearInterval(interval);
  }, [email, nickname]);
};

export const sendVisitEvent = async (email: string, nickname: string) => {
  try {
    await fetch(API_URLS.ADMIN_ACTIVITY, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        nickname,
        action: "visit",
      }),
    });
  } catch (error) {
    console.error('Failed to send visit event', error);
  }
};