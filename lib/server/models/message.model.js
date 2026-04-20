import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' },
  content: { type: String },
  attachments: [{ public_id: { type: String }, url: { type: String } }],
}, { timestamps: true });

const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

export default Message;
