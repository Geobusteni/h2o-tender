import * as Notifications from 'expo-notifications';

interface NotificationSchedule {
  hour: number;
  minute: number;
  mlAmount: number;
}

interface NotificationResponse {
  notification: Notifications.Notification;
  actionIdentifier: string;
}

export class NotificationService {
  private static CATEGORY_ID = 'HYDRATION_REMINDER';
  private static ACTION_DRINK_NOW = 'DRINK_NOW';
  private static ACTION_SKIP = 'SKIP';

  /**
   * Request notification permissions from the user
   * Must be called before scheduling any notifications
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permission not granted');
        return false;
      }

      // Configure notification handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Register notification categories with action buttons
   * Categories must be registered before scheduling notifications with actions
   */
  static async registerCategories(): Promise<void> {
    try {
      await Notifications.setNotificationCategoryAsync(this.CATEGORY_ID, [
        {
          identifier: this.ACTION_DRINK_NOW,
          buttonTitle: 'Drink Now',
          options: {
            opensAppToForeground: true,
          },
        },
        {
          identifier: this.ACTION_SKIP,
          buttonTitle: 'Skip',
          options: {
            opensAppToForeground: false,
          },
        },
      ]);

      console.log('Notification categories registered successfully');
    } catch (error) {
      console.error('Error registering notification categories:', error);
      throw error;
    }
  }

  /**
   * Schedule all daily hydration reminders
   * Schedules notifications between wakeTime and sleepTime
   *
   * @param schedule Array of notification times with ml amounts
   * @param wakeTime Wake time in "HH:MM" format (e.g., "07:00")
   * @param sleepTime Sleep time in "HH:MM" format (e.g., "22:00")
   */
  static async scheduleReminders(
    schedule: NotificationSchedule[],
    wakeTime: string,
    sleepTime: string
  ): Promise<string[]> {
    try {
      const notificationIds: string[] = [];

      // Parse wake and sleep times
      const [wakeHour, wakeMinute] = wakeTime.split(':').map(Number);
      const [sleepHour, sleepMinute] = sleepTime.split(':').map(Number);

      for (const reminder of schedule) {
        // Skip notifications outside wake/sleep window
        if (!this.isWithinActiveHours(reminder, wakeHour, wakeMinute, sleepHour, sleepMinute)) {
          continue;
        }

        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Hydration Reminder',
            body: `Drink ~${reminder.mlAmount} ml now.`,
            categoryIdentifier: this.CATEGORY_ID,
            data: {
              mlAmount: reminder.mlAmount,
              hour: reminder.hour,
              minute: reminder.minute,
            },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: reminder.hour,
            minute: reminder.minute,
          },
        });

        notificationIds.push(notificationId);
        console.log(`Scheduled reminder at ${reminder.hour}:${reminder.minute.toString().padStart(2, '0')} for ${reminder.mlAmount}ml`);
      }

      return notificationIds;
    } catch (error) {
      console.error('Error scheduling reminders:', error);
      throw error;
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  static async cancelAllReminders(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All scheduled notifications cancelled');
    } catch (error) {
      console.error('Error cancelling notifications:', error);
      throw error;
    }
  }

  /**
   * Reschedule all reminders with new schedule
   * Cancels existing notifications and schedules new ones
   */
  static async rescheduleReminders(
    newSchedule: NotificationSchedule[],
    wakeTime: string,
    sleepTime: string
  ): Promise<string[]> {
    try {
      await this.cancelAllReminders();
      return await this.scheduleReminders(newSchedule, wakeTime, sleepTime);
    } catch (error) {
      console.error('Error rescheduling reminders:', error);
      throw error;
    }
  }

  /**
   * Handle notification response (user tapped action button)
   *
   * @param response The notification response from the event listener
   * @param onDrink Callback when user taps "Drink Now"
   * @param onSkip Callback when user taps "Skip"
   */
  static handleNotificationResponse(
    response: NotificationResponse,
    onDrink: (mlAmount: number) => void,
    onSkip: () => void
  ): void {
    const { actionIdentifier, notification } = response;
    const data = notification.request.content.data as { mlAmount?: number };
    const mlAmount = data.mlAmount ?? 0;

    switch (actionIdentifier) {
      case this.ACTION_DRINK_NOW:
        console.log(`User chose to drink ${mlAmount}ml`);
        onDrink(mlAmount);
        break;

      case this.ACTION_SKIP:
        console.log('User skipped hydration reminder');
        onSkip();
        break;

      default:
        // User tapped the notification itself (not an action button)
        console.log('Notification tapped, opening app');
        onDrink(mlAmount);
        break;
    }
  }

  /**
   * Set up notification response listener
   * Should be called once during app initialization
   *
   * Example usage:
   * NotificationService.setupNotificationListener(
   *   (mlAmount) => console.log('Drink', mlAmount),
   *   () => console.log('Skipped')
   * );
   */
  static setupNotificationListener(
    onDrink: (mlAmount: number) => void,
    onSkip: () => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener((response: any) => {
      this.handleNotificationResponse(response, onDrink, onSkip);
    });
  }

  /**
   * Check if a reminder time is within active hours
   */
  private static isWithinActiveHours(
    reminder: NotificationSchedule,
    wakeHour: number,
    wakeMinute: number,
    sleepHour: number,
    sleepMinute: number
  ): boolean {
    const reminderMinutes = reminder.hour * 60 + reminder.minute;
    const wakeMinutes = wakeHour * 60 + wakeMinute;
    const sleepMinutes = sleepHour * 60 + sleepMinute;

    if (sleepMinutes > wakeMinutes) {
      // Normal case: wake and sleep on same day
      return reminderMinutes >= wakeMinutes && reminderMinutes <= sleepMinutes;
    } else {
      // Edge case: sleep time crosses midnight
      return reminderMinutes >= wakeMinutes || reminderMinutes <= sleepMinutes;
    }
  }

  /**
   * Get all scheduled notifications (useful for debugging)
   */
  static async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Send an immediate test notification
   * Useful for testing notification setup
   */
  static async sendTestNotification(): Promise<string> {
    try {
      return await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Test Notification',
          body: 'Hydration reminders are working!',
          categoryIdentifier: this.CATEGORY_ID,
          data: {
            mlAmount: 250,
            isTest: true,
          },
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      throw error;
    }
  }

  /**
   * Schedule a test notification 1-2 minutes in the future
   * Useful for testing the full notification flow including actions
   * DEV MODE ONLY
   */
  static async scheduleTestNotification(minutesFromNow: number = 1): Promise<string> {
    try {
      const seconds = minutesFromNow * 60;

      return await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Hydration Reminder (Test)',
          body: 'Drink ~250 ml now. This is a test notification.',
          categoryIdentifier: this.CATEGORY_ID,
          data: {
            mlAmount: 250,
            isTest: true,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: seconds,
        },
      });
    } catch (error) {
      console.error('Error scheduling test notification:', error);
      throw error;
    }
  }
}
