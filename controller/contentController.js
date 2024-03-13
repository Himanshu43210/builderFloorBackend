import contentModel from "../models/contentModel.js";
import AWS from "aws-sdk";

const uploadOnS3 = async (req, res) => {
    let file = req.file;
    const s3 = new AWS.S3({
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    });

    return new Promise((resolve, reject) => {
        const s3Key = req.fileKey;
        const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: s3Key,
            Body: file.buffer,
            ContentType: file.mimetype,
        };

        s3.upload(params, (err, data) => {
            if (err) {
                console.error("Error uploading to S3:", err);
                reject(err);
            } else {
                resolve(data.Location);
            }
        });
    });
};

const create = async (req, res) => {
    try {
        if (req.file) {
            req.fileKey = `${Date.now()}${req.file.originalname}`;
            req.body.file = await uploadOnS3(req, res)
        }
        const result = await contentModel.create(req.body);
        return res.status(200).json({ result, message: "data added successfully", status: 200 })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message, status: 500 })
    }
}

const update = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) {
            return res.status(400).json({ message: "id is required", status: 400 })
        }
        if (req.file) {
            req.fileKey = `${Date.now()}${req.file.originalname}`;
            req.body.file = await uploadOnS3(req, res)
        }
        const result = await contentModel.findByIdAndUpdate({ _id: id }, req.body, { new: true });
        return res.status(200).json({ result, message: "data updated successfully", status: 200 })
    } catch (error) {
        return res.status(500).json({ message: error.message, status: 500 })
    }
}

const findById = async (req, res) => {
    try {
        const { id } = req.query;
        if (!id) {
            return res.status(400).json({ message: "id is required", status: 400 })
        }
        const result = await contentModel.findOne({ _id: id });
        return res.status(200).json({ result, message: "data fetched successfully", status: 200 })
    } catch (error) {
        return res.status(500).json({ message: error.message, status: 500 })
    }
}

const deleteById = async (req, res) => {
    try {
        const { id } = req.query;
        if (!id) {
            return res.status(400).json({ message: "id is required", status: 400 })
        }
        const result = await contentModel.findByIdAndDelete({ _id: id });
        return res.status(200).json({ result, message: "data deleted successfully", status: 200 })
    } catch (error) {
        return res.status(500).json({ message: error.message, status: 500 })
    }
}

const findAll = async (req, res) => {
    try {
        const limit = req.query.limit || 20;
        const page = req.query.page || 0;
        const category = req.query.category;
        const query = {};
        if (category) {
            query.category = category;
        }
        const result = await contentModel.find(query).sort({ updatedAt: -1 }).limit(limit).skip(limit * page);
        const totalCount = await contentModel.countDocuments(query);
        return res.status(200).json({ result, totalCount, message: "data list fetched successfully", status: 200 })
    } catch (error) {
        return res.status(500).json({ message: error.message, status: 500 })
    }
}

export default { create, findAll, update, findById, deleteById }