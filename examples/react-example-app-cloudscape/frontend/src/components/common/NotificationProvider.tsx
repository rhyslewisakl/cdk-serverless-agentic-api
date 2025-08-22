import React, { useEffect } from 'react';
import { Flashbar } from '@cloudscape-design/components';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { removeNotification } from '../../store/notificationSlice';

export const NotificationProvider: React.FC = () => {
  const dispatch = useAppDispatch();
  const { notifications } = useAppSelector((state) => state.notifications);

  useEffect(() => {
    // Auto-dismiss notifications after 5 seconds
    const timers = notifications
      .filter((notification) => notification.autoDismiss)
      .map((notification) =>
        setTimeout(() => {
          dispatch(removeNotification(notification.id));
        }, 5000)
      );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [notifications, dispatch]);

  const handleDismiss = (id: string) => {
    dispatch(removeNotification(id));
  };

  const flashbarItems = notifications.map((notification) => ({
    id: notification.id,
    type: notification.type,
    header: notification.header,
    content: notification.content,
    dismissible: notification.dismissible ?? true,
    onDismiss: (notification.dismissible ?? true)
      ? () => handleDismiss(notification.id)
      : undefined,
  }));

  return (
    <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 1000 }}>
      <Flashbar items={flashbarItems} />
    </div>
  );
};