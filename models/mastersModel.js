import mongoose from 'mongoose';
const { Schema } = mongoose;



const mastersSchema = new Schema( {

    fieldName : {    type :    String ,      },

    fieldValue : {    type :    Array ,      }, 
    

  },  {timestamps:true}
  )

const masters = mongoose.model("masters", mastersSchema);

export default masters;
