import mongoose from 'mongoose';

const linkSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    boards: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Board',
      },
    ],
  },
  { timestamps: true }
);

export const Link = mongoose.model('Link', linkSchema);
