import mongoose from 'mongoose';
const { Schema } = mongoose;
import validator from './validator.js';


const mastersSchema = new Schema( {

    fieldName : {    type :    String ,      },

    fieldValue : {    type :    Array ,      }, 
    

  },  {timestamps:true}
  )

const masters = mongoose.model("masters", mastersSchema);

export default masters;