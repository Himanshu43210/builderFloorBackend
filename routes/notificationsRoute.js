import express from 'express';
import notificationsController from '../controller/notificationsController.js';

const router = express.Router();

router
    .get('/count', notificationsController.getNotifCounts)
    .get('/adminNotifications', notificationsController.getAdminNotifications)
    .get('/brokerNotifications', notificationsController.getBrokerNotifications)
    .get('/subUserNotifications', notificationsController.getSubUserNotifications);

export default router;