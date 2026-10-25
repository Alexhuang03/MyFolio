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
    // Partie de l'image affichée sur la carte : point de cadrage (en %) et zoom
    imageFrame: {
      type: new mongoose.Schema(
        {
          x: { type: Number, default: 50, min: 0, max: 100 },
          y: { type: Number, default: 50, min: 0, max: 100 },
          zoom: { type: Number, default: 1, min: 1, max: 4 },
        },
        { _id: false }
      ),
      default: () => ({}),
    },
    price: {
      type: Number,
      default: null,
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },
    date: {
      type: String,
      default: '',
      trim: true,
    },
    rating: {
      type: Number,
      default: null,
      min: 0,
      max: 5,
    },
    url: {
      type: String,
      default: '',
      trim: true,
    },
    customValues: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
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
