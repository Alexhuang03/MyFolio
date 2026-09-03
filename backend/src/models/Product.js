import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom du produit est obligatoire'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    image: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      default: null,
    },
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
      index: true,
    },
    labelIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Label',
        index: true,
      },
    ],
    subLabelIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubLabel',
        index: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Product', ProductSchema);
