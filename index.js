const multer = require('multer');
const AWS = require('aws-sdk');
require('dotenv').config();
const express = require('express');
const app = express();
const port = 3000;

const cors = require('cors')
var corOptions = {
    Origin:true
}
app.use(cors(corOptions));


app.use(express.static('upload'))
app.use(express.json());
app.use(express.urlencoded({extended: true}))

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_BUCKET_REGION
});

// Create an instance of the S3 service
const s3 = new AWS.S3();
const storage = multer.memoryStorage();
const upload = multer({ storage });


// API endpoint to fetch all images from the S3 bucket
app.get('/image/all', (req, res) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME
  };
  console.log(params)

  s3.listObjectsV2(params, (err, data) => {
    if (err) {
      console.log(err);
      res.status(500).json({ error: 'Failed to fetch images from S3 bucket' });
    } else {
      const imageUrls = data.Contents.map((obj) => {
        return {
          key: obj.Key,
          url: `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${obj.Key}`
        };
      });
      res.json({ images: imageUrls });
    }
  });
});

// API endpoint to upload an image to the S3 bucket
app.post('/upload/image', upload.single('image'), async (req, res) => {
    const { originalname, buffer } = req.file;
    const filename = Date.now() + '-' + originalname;

  if (!filename) {
    res.status(400).json({ error: 'No image file uploaded' });
    return;
  }

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: filename,
    Body: buffer,
    //ACL: 'public-read' // Set the appropriate ACL based on your requirements
  };

  console.log(params)

  s3.upload(params, (err, data) => {
    if (err) {
      console.log(err);
      res.status(500).json({ error: 'Failed to upload image to S3 bucket' });
    } else {
      res.json({ url: data.Location });
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
