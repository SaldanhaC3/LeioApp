INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', TRUE) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('checkin-photos', 'checkin-photos', TRUE) ON CONFLICT DO NOTHING;

CREATE POLICY "Avatars are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users upload own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Checkin photos publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'checkin-photos');
CREATE POLICY "Auth users upload checkin photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'checkin-photos' AND auth.uid() IS NOT NULL);
