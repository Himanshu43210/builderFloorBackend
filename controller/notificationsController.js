import notifications from "../models/notificationsModel";


const getNotifications = async (res, res, next) => {
    try {
        const { id } = req.query;
        if (req?.query?.id) {
            const query = { userId: id };
            const data = await notifications.find(query);
            return res.status(200).json({
                data: data
            });
        } else {
            const query = { admin: true };
            const data = await notifications.find(query);
            return res.status(200).json({
                data: data
            });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getBrokerNotifications = async (req, res, next) => {
    try {
        const query = { userId: id };
        const data = await notifications.find(query);
        return res.status(200).json({
            data: data
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
            data: data
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


export default {
    getNotifications,
    getBrokerNotifications,
    getSubUserNotifications,
};