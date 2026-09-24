import mongoose from 'mongoose';

const BookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Le titre du livre est obligatoire'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    coverImage: {
      type: String,
      default: 'cover-classic.svg',
    },
    colorTheme: {
      type: String,
      default: '#3b82f6', // Tailwind blue-500
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fieldsConfig: {
      hasImage: { type: Boolean, default: true },
      hasPrice: { type: Boolean, default: true },
      hasLocation: { type: Boolean, default: false },
      hasDate: { type: Boolean, default: false },
      hasRating: { type: Boolean, default: false },
      hasUrl: { type: Boolean, default: false },
      hasDescription: { type: Boolean, default: true },
      customFields: [
        {
          name: { type: String, required: true },
          type: { type: String, enum: ['text', 'number', 'date', 'url'], default: 'text' },
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Book', BookSchema);
