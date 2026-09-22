/**
 * Toma el Rasol - Application Configuration
 * 
 * Replace SUPABASE_URL and SUPABASE_ANON_KEY with your live Supabase project details.
 * If left empty or invalid, the application automatically uses the local storage mock driver
 * so all features, workflows, and UI interactions work immediately offline or in demo mode!
 */
window.APP_CONFIG = {
  // Live Supabase Credentials
  SUPABASE_URL: '', // e.g. 'https://your-project.supabase.co'
  SUPABASE_ANON_KEY: '', // e.g. 'eyJhbGciOiJIUzI1NiIsInR...'

  // App Settings
  APP_NAME: 'Toma el Rasol',
  CHURCH_CLASS: 'St. Thomas Youth Class',
  DEFAULT_QR_BASE_URL: window.location.origin + window.location.pathname.replace(/Toma_elrasol\.html|admin\/index\.html|user\/index\.html/g, '') + 'user/index.html'
};
