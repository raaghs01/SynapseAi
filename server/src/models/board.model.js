import mongoose from 'mongoose';

const boardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    link: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Link',
      required: true,
    },
    charts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chart',
      },
    ],
  },
  { timestamps: true }
);

export const Board = mongoose.model('Board', boardSchema);
