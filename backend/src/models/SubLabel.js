import mongoose from 'mongoose';

const SubLabelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom du sous-label est obligatoire'],
      trim: true,
    },
    color: {
      type: String,
      default: '#10b981', // Emerald
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

SubLabelSchema.index({ bookId: 1, name: 1 }, { unique: true });

export default mongoose.model('SubLabel', SubLabelSchema);
