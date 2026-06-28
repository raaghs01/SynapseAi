import mongoose , {Schema} from 'mongoose';

const linkSchema = new Schema(
  // name and desc required for the dashboard on which all the links for a single user will be listed
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // link can be created by empty boards 
    boards: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Board',
        // required: true,
      },
    ],
    inviteCode: {
      type: String,
      unique: true,
    },

  },
  { timestamps: true }
);

export const Link = mongoose.model('Link', linkSchema);
