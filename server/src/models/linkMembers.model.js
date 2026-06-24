import mongoose from 'mongoose';
import { UserRolesEnum, AvailableUserRoles } from '../constants.js';

const linkMemberSchema = new mongoose.Schema(
  {
    link: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Link',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: AvailableUserRoles,
      default: UserRolesEnum.MEMBER,
    },
  },
  { timestamps: true }
);

linkMemberSchema.index({ link: 1, user: 1 }, { unique: true });
linkMemberSchema.index({ user: 1 });

export const LinkMember = mongoose.model('LinkMember', linkMemberSchema);
