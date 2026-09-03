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
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Book', BookSchema);
