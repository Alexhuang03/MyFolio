import mongoose from 'mongoose';

const LabelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom du label est obligatoire'],
      trim: true,
    },
    color: {
      type: String,
      default: '#6366f1', // Indigo
    },
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

LabelSchema.index({ bookId: 1, name: 1 }, { unique: true });

export default mongoose.model('Label', LabelSchema);
