import notifications from "../models/notificationsModel.js";


const getAdminNotifications = async (req, res, next) => {
    try {
        const query = { admin: true };
        const data = await notifications.find(query);
        return res.status(200).json({
            data
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getBrokerNotifications = async (req, res, next) => {
    try {
        const { id } = req.query;
        const query = { userId: id };
        const data = await notifications.find(query);
        return res.status(200).json({
            data
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getSubUserNotifications = async (req, res, next) => {
    try {
        const { id } = req.query;
        const query = { userId: id };
        const data = await notifications.find(query);
        return res.status(200).json({
            data
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getNotifCounts = async (req, res, next) => {
    try {
        const query = req?.query?.id ? { userId: req?.query?.id } : { admin: true };
        const totalDocuments = await notifications.countDocuments(query);
        return res.status(200).json({
            count: totalDocuments
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


export default {
    getAdminNotifications,
    getBrokerNotifications,
    getSubUserNotifications,
    getNotifCounts,
};