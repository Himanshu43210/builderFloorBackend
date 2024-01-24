import express from 'express';
import notificationsController from '../controller/notificationsController';

const router = express.Router();

router
    .get('/adminNotifications', notificationsController.getAdminNotifications)
    .get('/brokerNotifications', notificationsController.getBrokerNotifications)
    .get('/subUserNotifications', notificationsController.getSubUserNotifications);

export default router;