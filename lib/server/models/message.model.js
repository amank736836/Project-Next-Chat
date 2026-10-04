import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Set only for private AI answers: visible solely to this user.
  privateTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },
  chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' },
  content: { type: String },
  replyTo: {
    senderName: {
      type: String,
      trim: true,
      default: '',
    },
    content: {
      type: String,
      trim: true,
      default: '',
    },
  },
  hiddenFromShowcase: {
    type: Boolean,
    default: false,
    index: true,
  },
  attachments: [{ public_id: { type: String }, url: { type: String } }],
}, { timestamps: true });

const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

export default Message;
