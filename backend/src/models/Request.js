import mongoose from 'mongoose';

export const REQUEST_STATUSES = ['pending', 'approved', 'rejected', 'cancelled'];

const historySchema = new mongoose.Schema({
  at: { type: Date, required: true },
  label: { type: String, required: true },
  kind: { type: String, enum: ['created', 'approved', 'rejected', 'cancelled', 'note'], required: true },
}, { _id: false });

const requestSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  material: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  quantity: { type: Number, required: true, min: 1 },
  dateNeeded: { type: Date, required: true },
  status: { type: String, enum: REQUEST_STATUSES, default: 'pending', index: true },
  justification: { type: String, required: true, maxlength: 600 },
  note: { type: String, default: null, maxlength: 300 },
  rejectionReason: { type: String, default: null, maxlength: 400 },
  history: { type: [historySchema], default: [] },
}, { timestamps: true });

export const Request = mongoose.model('Request', requestSchema);

const counterSchema = new mongoose.Schema({ _id: String, seq: { type: Number, default: 0 } });
const Counter = mongoose.model('Counter', counterSchema);

export async function nextRequestCode() {
  const counter = await Counter.findOneAndUpdate({ _id: 'request' }, { $inc: { seq: 1 } }, { upsert: true, new: true });
  return `REQ-${counter.seq}`;
}

export async function ensureRequestCounter(atLeast) {
  await Counter.updateOne({ _id: 'request' }, { $max: { seq: atLeast } }, { upsert: true });
}
