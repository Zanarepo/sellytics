import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function PushNotificationManager({ opt = {} }) {
  const [isSupported, setIsSupported] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState("unsubscribed");
  const [permissionState, setPermissionState] = useState(Notification.permission);
  const [storeId, setStoreId] = useState(null);

  const VAPID_PUBLIC_KEY = process.env.REACT_APP_VAPID_PUBLIC_KEY;

  const urlBase64ToUint8Array = (base64String) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  useEffect(() => {
    const fetchStoreId = async () => {
      try {
        let id = localStorage.getItem("store_id") || opt.storeId;

        if (!id) {
          const { data, error } = await supabase.from("stores").select("id").limit(1).single();
          if (error || !data) throw error || new Error("Store not found");
          id = data.id;
        }

        localStorage.setItem("store_id", id);
        setStoreId(id);
      } catch (error) {
        toast.error("Failed to load store: " + error.message);
      }
    };

    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      fetchStoreId();
    } else {
      toast.error("Push notifications are not supported in this browser.");
    }
  }, [opt.storeId]);

  const subscribeToNotifications = async () => {
    if (!storeId) {
      toast.error("Store ID not found.");
      return;
    }
  
    if (!VAPID_PUBLIC_KEY) {
      toast.error("Missing VAPID public key.");
      return;
    }
  
    try {
      const readyReg = await navigator.serviceWorker.ready;
  
      const subscription = await readyReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
  
      const { endpoint, keys } = subscription.toJSON();
  
      // Remove any existing record for this endpoint + store combo
      await supabase
        .from("push_subscriptions")
        .delete()
        .eq("store_id", storeId)
        .eq("endpoint", endpoint);
  
      const { error } = await supabase.from("push_subscriptions").insert({
        store_id: storeId,
        endpoint,
        keys,
      });
  
      if (error) throw error;
  
      setSubscriptionStatus("subscribed");
      toast.success("Subscribed to notifications!");
    } catch (error) {
      console.error("Subscription failed:", error);
      toast.error("Subscription failed: " + error.message);
    }
  };
  





  const unsubscribeFromNotifications = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const { endpoint } = subscription;
        await subscription.unsubscribe();

        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("store_id", storeId)
          .eq("endpoint", endpoint);

        setSubscriptionStatus("unsubscribed");
        toast.success("Unsubscribed successfully!");
      } else {
        toast.info("No active subscription found.");
      }
    } catch (error) {
      console.error("Unsubscription failed:", error);
      toast.error("Unsubscription failed: " + error.message);
    }
  };

  useEffect(() => {
    setPermissionState(Notification.permission);
  }, [subscriptionStatus]);

  if (!isSupported) return null;

  if (permissionState === "denied") {
    return (
      <div className="p-4 bg-white rounded-md shadow-md dark:bg-gray-800 dark:text-white">
        <h2 className="text-xl font-semibold mb-4">Notifications</h2>
        <p>Notifications are blocked. Please enable them in your browser settings.</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-md shadow-md dark:bg-gray-800 dark:text-white">
      <h2 className="text-xl font-semibold mb-4">Notifications</h2>
      <ToastContainer />
      <div className="flex flex-col sm:flex-row gap-4">
        {subscriptionStatus === "unsubscribed" ? (
          <button
            onClick={subscribeToNotifications}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            disabled={!storeId}
          >
            Enable Notifications
          </button>
        ) : (
          <button
            onClick={unsubscribeFromNotifications}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Disable Notifications
          </button>
        )}
      </div>
    </div>
  );
}
