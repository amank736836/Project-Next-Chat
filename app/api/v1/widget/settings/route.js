import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/server/db.js';
import WidgetSettings from '../../../../../lib/server/models/widgetSettings.model.js';
import { getAuthenticatedUser } from '../../../../../lib/server/auth.js';
import { withCors, corsPreflight } from '../../../../../lib/server/cors.js';
import { sanitizeWidgetSettings, WIDGET_DEFAULTS } from '../../../../../lib/widgetConfig.js';

export async function OPTIONS() {
  return corsPreflight();
}

// Public: any external website can fetch display settings for a username.
// CORS * so <script src=".../widget.js"> works cross-origin.
export async function GET(request) {
  try {
    await connectDB();
    const url = new URL(request.url);
    const username = (url.searchParams.get('username') || '').trim().toLowerCase();

    if (!username) {
      return withCors({ success: false, message: 'username is required' }, { status: 400 });
    }

    const doc = await WidgetSettings.findOne({ username }).lean();
    const settings = sanitizeWidgetSettings(doc || WIDGET_DEFAULTS);

    return withCors({ success: true, username, settings }, { status: 200 });
  } catch {
    return withCors({ success: false, message: 'Failed to fetch widget settings' }, { status: 500 });
  }
}

// Owner-only: save display settings for own board.
export async function PUT(request) {
  try {
    await connectDB();
    const authUser = await getAuthenticatedUser(request);

    if (!authUser) {
      return NextResponse.json({ success: false, message: 'Please login to continue' }, { status: 401 });
    }

    const body = await request.json();
    const username = (body.username || '').trim().toLowerCase();

    if (!username || username !== authUser.username.toLowerCase()) {
      return NextResponse.json({ success: false, message: 'Unauthorized update attempt' }, { status: 403 });
    }

    const settings = sanitizeWidgetSettings(body.settings || body);

    const updated = await WidgetSettings.findOneAndUpdate(
      { username },
      { $set: { username, ...settings } },
      { new: true, upsert: true }
    ).lean();

    return NextResponse.json(
      { success: true, settings: sanitizeWidgetSettings(updated) },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to save widget settings' }, { status: 500 });
  }
}
