import mongoose from 'mongoose';

const ideaSchema = new mongoose.Schema(
  {
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    idea_space: {
      type: String,
      trim: true,
    },
    inspiration: {
      type: String,
      trim: true,
    },
    github_link: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
    },
    likes: {
      type: Number,
      default: 0,
    },
    likedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    prevNodes: [
      {
        type: String,
      },
    ],
    chart: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chart',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

export const Idea = mongoose.model('Idea', ideaSchema);
