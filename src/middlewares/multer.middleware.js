import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      // here cb is a callback
      cb(null, "./public/temp")
      // ./public/temp -> where we want to upload our files
    },
    filename: function (req, file, cb) {
      
      cb(null, file.originalname)
      // for now we want to saave the file as the same given by the user
    }
  })
  
export const upload = multer({ 
    storage: storage
    // can also write only ->  storage  (ES6 features)  
})

/*

1. wherever we need to thr capability to upload files...we will inject multer there
2. we wrote .middleware to say that it is middleware file
3. we will use disk storage instead of memory storage
4. 

*/