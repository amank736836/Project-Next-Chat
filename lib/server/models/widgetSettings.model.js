import { WIDGET_DEFAULTS } from '../../widgetConfig.js';
import mongoose from 'mongoose';

const widgetSettingsSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      minlength: 3,
      maxlength: 30,
      match: [/^[a-z0-9_]+$/, 'Username must be alphanumeric and underscores only'],
    },
    position: {
      type: String,
      enum: ['bottom-right', 'bottom-left', 'top-right', 'top-left', 'bottom-center'],
      default: 'bottom-right',
    },
    themeColor: { type: String, default: WIDGET_DEFAULTS.themeColor, trim: true },
    backgroundColor: { type: String, default: '#ffffff', trim: true },
    textColor: { type: String, default: WIDGET_DEFAULTS.textColor, trim: true },
    title: { type: String, default: 'Send feedback', trim: true, maxlength: 80 },
    subtitle: { type: String, default: 'We read every message', trim: true, maxlength: 140 },
    placeholder: {
      type: String,
      default: 'Write your anonymous message here...',
      trim: true,
      maxlength: 200,
    },
    buttonText: { type: String, default: 'Send', trim: true, maxlength: 40 },
    bubbleLabel: { type: String, default: '💬', trim: true, maxlength: 12 },
    shape: { type: String, enum: ['round', 'square', 'pill'], default: 'round' },
    size: { type: String, enum: ['sm', 'md', 'lg'], default: 'md' },
    autoOpenDelay: { type: Number, default: 0, min: 0, max: 120 },
    showSuggestions: { type: Boolean, default: true },
    enabled: { type: Boolean, default: true },
    // Websites the owner pasted the snippet on (asked up-front, max 20).
    sites: { type: [String], default: [] },
  },
  { timestamps: true }
);

const WidgetSettings =
  mongoose.models.WidgetSettings ||
  mongoose.model('WidgetSettings', widgetSettingsSchema);

export default WidgetSettings;
