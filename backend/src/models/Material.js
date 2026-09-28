import mongoose from 'mongoose';

export const CATEGORIES = ['Informatique', 'Audiovisuel', 'Mobilier', 'Réseau'];

const materialSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  category: { type: String, enum: CATEGORIES, required: true },
  description: { type: String, trim: true, maxlength: 300, default: '' },
  quantity: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 1 },
  image: {
    type: new mongoose.Schema({ url: { type: String, required: true }, publicId: { type: String, default: null } }, { _id: false }),
    default: null,
  },
  // Soft delete keeps past requests readable and lets the admin undo a deletion.
  archivedAt: { type: Date, default: null, index: true },
}, { timestamps: true });

export const Material = mongoose.model('Material', materialSchema);
