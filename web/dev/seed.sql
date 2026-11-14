-- Demo data for LIVE mode (PostgreSQL from docker-compose, DB FixItDb).
-- Usage: psql "host=localhost port=5433 dbname=FixItDb user=postgres password=postgres" -f web/dev/seed.sql
-- Enums are stored as strings (EF HasConversion<string>).
-- Passwords are verified by the backend (PBKDF2 via ASP.NET Core PasswordHasher). Every demo account
-- uses the password Demo123! (one hash shared by all rows). Re-running this file resets the passwords.

INSERT INTO "Tenants" ("Id","Name","Description","IsActive","TenantId","CreatedAt","IsDeleted") VALUES
 ('11111111-1111-4111-8111-111111111111','Hydro-Serwis Nowak','Plumbing, heating & HVAC services','true','11111111-1111-4111-8111-111111111111',now(),false)
ON CONFLICT DO NOTHING;

-- Tenant settings (columns from migration AddTenantSettings). A plain UPDATE, so re-running the
-- seed also resets everything editable on the settings page (name and description included).
UPDATE "Tenants" SET
  "Name" = 'Hydro-Serwis Nowak',
  "Description" = 'Plumbing, heating & HVAC services',
  "ContactEmail" = 'biuro@hydro-serwis.pl',
  "Phone" = '+48 22 123 45 67',
  "Address" = 'ul. Wodna 12, 00-001 Warszawa',
  "Timezone" = 'Europe/Warsaw',
  "Plan" = 'team'
WHERE "Id" = '11111111-1111-4111-8111-111111111111';

INSERT INTO "Users" ("Id","Email","FirstName","LastName","Role","IsActive","TenantId","CreatedAt","IsDeleted","PasswordHash") VALUES
 ('22222222-2222-4222-8222-222222222201','marta.nowak@hydro-serwis.pl','Marta','Nowak','Admin',true,'11111111-1111-4111-8111-111111111111',now(),false,'AQAAAAIAAYagAAAAEM7b+63PivQ9BAz7C49mj0L9t+r1qA5ACa5wRYYEUywEX9M/nZRinOYyvN0JqFr4Xw=='),
 ('22222222-2222-4222-8222-222222222202','tomasz.kowalczyk@hydro-serwis.pl','Tomasz','Kowalczyk','Worker',true,'11111111-1111-4111-8111-111111111111',now(),false,'AQAAAAIAAYagAAAAEM7b+63PivQ9BAz7C49mj0L9t+r1qA5ACa5wRYYEUywEX9M/nZRinOYyvN0JqFr4Xw=='),
 ('22222222-2222-4222-8222-222222222203','anna.wisniewska@hydro-serwis.pl','Anna','Wiśniewska','Worker',true,'11111111-1111-4111-8111-111111111111',now(),false,'AQAAAAIAAYagAAAAEM7b+63PivQ9BAz7C49mj0L9t+r1qA5ACa5wRYYEUywEX9M/nZRinOYyvN0JqFr4Xw=='),
 ('22222222-2222-4222-8222-222222222204','bartosz.jankowski@gmail.com','Bartosz','Jankowski','Customer',true,'11111111-1111-4111-8111-111111111111',now(),false,'AQAAAAIAAYagAAAAEM7b+63PivQ9BAz7C49mj0L9t+r1qA5ACa5wRYYEUywEX9M/nZRinOYyvN0JqFr4Xw=='),
 ('22222222-2222-4222-8222-222222222205','katarzyna.jablonska@gmail.com','Katarzyna','Jabłońska','Customer',true,'11111111-1111-4111-8111-111111111111',now(),false,'AQAAAAIAAYagAAAAEM7b+63PivQ9BAz7C49mj0L9t+r1qA5ACa5wRYYEUywEX9M/nZRinOYyvN0JqFr4Xw==')
ON CONFLICT ("Id") DO UPDATE SET "PasswordHash" = EXCLUDED."PasswordHash";

INSERT INTO "WorkerProfiles" ("Id","UserId","Specialization","PhoneNumber","IsAvailable","TenantId","CreatedAt","IsDeleted") VALUES
 ('33333333-3333-4333-8333-333333333301','22222222-2222-4222-8222-222222222202','Plumbing','+48 600 100 200',true,'11111111-1111-4111-8111-111111111111',now(),false),
 ('33333333-3333-4333-8333-333333333302','22222222-2222-4222-8222-222222222203','Heating & boilers','+48 600 300 400',true,'11111111-1111-4111-8111-111111111111',now(),false)
ON CONFLICT DO NOTHING;

INSERT INTO "ServiceRequests" ("Id","Title","Description","CustomerId","AssignedWorkerId","Status","Notes","TenantId","CreatedAt","IsDeleted") VALUES
 ('44444444-4444-4444-8444-444444444401','Leaking kitchen sink trap','Water pools under the sink after every use.','22222222-2222-4222-8222-222222222204',NULL,'Pending',NULL,'11111111-1111-4111-8111-111111111111',now() - interval '1 day',false),
 ('44444444-4444-4444-8444-444444444402','Boiler not heating water','Error F.28, no hot water since yesterday.','22222222-2222-4222-8222-222222222205','22222222-2222-4222-8222-222222222203','Assigned',NULL,'11111111-1111-4111-8111-111111111111',now() - interval '2 days',false),
 ('44444444-4444-4444-8444-444444444403','Radiator valve stuck','Thermostatic valve will not turn.','22222222-2222-4222-8222-222222222204','22222222-2222-4222-8222-222222222202','InProgress','On site, diagnosing.','11111111-1111-4111-8111-111111111111',now() - interval '3 days',false),
 ('44444444-4444-4444-8444-444444444404','Annual boiler service','Yearly inspection for warranty.','22222222-2222-4222-8222-222222222205','22222222-2222-4222-8222-222222222203','Completed','Serviced and tested.','11111111-1111-4111-8111-111111111111',now() - interval '10 days',false)
ON CONFLICT DO NOTHING;

-- Status history so the dashboard (completion metrics, volume, activity) has something to show.
-- Request 404 is completed 9 days ago, i.e. ~24 h after it was created.
INSERT INTO "ServiceLogs" ("Id","ServiceRequestId","PreviousStatus","NewStatus","Notes","ChangedByUserId","TenantId","CreatedAt","IsDeleted") VALUES
 ('55555555-5555-4555-8555-555555555501','44444444-4444-4444-8444-444444444402','Pending','Assigned',NULL,'22222222-2222-4222-8222-222222222201','11111111-1111-4111-8111-111111111111',now() - interval '2 days' + interval '2 hours',false),
 ('55555555-5555-4555-8555-555555555502','44444444-4444-4444-8444-444444444403','Pending','Assigned',NULL,'22222222-2222-4222-8222-222222222201','11111111-1111-4111-8111-111111111111',now() - interval '3 days' + interval '1 hour',false),
 ('55555555-5555-4555-8555-555555555503','44444444-4444-4444-8444-444444444403','Assigned','InProgress','On site, diagnosing.','22222222-2222-4222-8222-222222222202','11111111-1111-4111-8111-111111111111',now() - interval '2 days',false),
 ('55555555-5555-4555-8555-555555555504','44444444-4444-4444-8444-444444444404','Pending','Assigned',NULL,'22222222-2222-4222-8222-222222222201','11111111-1111-4111-8111-111111111111',now() - interval '10 days' + interval '1 hour',false),
 ('55555555-5555-4555-8555-555555555505','44444444-4444-4444-8444-444444444404','Assigned','InProgress',NULL,'22222222-2222-4222-8222-222222222203','11111111-1111-4111-8111-111111111111',now() - interval '10 days' + interval '4 hours',false),
 ('55555555-5555-4555-8555-555555555506','44444444-4444-4444-8444-444444444404','InProgress','Completed','Serviced and tested.','22222222-2222-4222-8222-222222222203','11111111-1111-4111-8111-111111111111',now() - interval '9 days',false)
ON CONFLICT DO NOTHING;

-- In-app notifications (table from migration AddOutboxAndNotifications), mirroring what the queue
-- consumer would have created for the status history above: customer + assigned worker + admins,
-- minus whoever made the change. SourceEventId reuses the ServiceLog id so each change maps to one
-- event. Older items (request 404) are already read. ON CONFLICT keeps read state on re-runs.
INSERT INTO "Notifications" ("Id","RecipientUserId","Type","ServiceRequestId","PreviousStatus","NewStatus","ActorUserId","SourceEventId","ReadAt","TenantId","CreatedAt","IsDeleted") VALUES
 -- 402 Pending -> Assigned by Marta (admin)
 ('66666666-6666-4666-8666-666666666601','22222222-2222-4222-8222-222222222205','ServiceRequestStatusChanged','44444444-4444-4444-8444-444444444402','Pending','Assigned','22222222-2222-4222-8222-222222222201','55555555-5555-4555-8555-555555555501',NULL,'11111111-1111-4111-8111-111111111111',now() - interval '2 days' + interval '2 hours',false),
 ('66666666-6666-4666-8666-666666666602','22222222-2222-4222-8222-222222222203','ServiceRequestStatusChanged','44444444-4444-4444-8444-444444444402','Pending','Assigned','22222222-2222-4222-8222-222222222201','55555555-5555-4555-8555-555555555501',NULL,'11111111-1111-4111-8111-111111111111',now() - interval '2 days' + interval '2 hours',false),
 -- 403 Pending -> Assigned by Marta (admin)
 ('66666666-6666-4666-8666-666666666603','22222222-2222-4222-8222-222222222204','ServiceRequestStatusChanged','44444444-4444-4444-8444-444444444403','Pending','Assigned','22222222-2222-4222-8222-222222222201','55555555-5555-4555-8555-555555555502',now() - interval '3 days' + interval '3 hours','11111111-1111-4111-8111-111111111111',now() - interval '3 days' + interval '1 hour',false),
 ('66666666-6666-4666-8666-666666666604','22222222-2222-4222-8222-222222222202','ServiceRequestStatusChanged','44444444-4444-4444-8444-444444444403','Pending','Assigned','22222222-2222-4222-8222-222222222201','55555555-5555-4555-8555-555555555502',now() - interval '3 days' + interval '2 hours','11111111-1111-4111-8111-111111111111',now() - interval '3 days' + interval '1 hour',false),
 -- 403 Assigned -> InProgress by Tomasz (worker)
 ('66666666-6666-4666-8666-666666666605','22222222-2222-4222-8222-222222222204','ServiceRequestStatusChanged','44444444-4444-4444-8444-444444444403','Assigned','InProgress','22222222-2222-4222-8222-222222222202','55555555-5555-4555-8555-555555555503',NULL,'11111111-1111-4111-8111-111111111111',now() - interval '2 days',false),
 ('66666666-6666-4666-8666-666666666606','22222222-2222-4222-8222-222222222201','ServiceRequestStatusChanged','44444444-4444-4444-8444-444444444403','Assigned','InProgress','22222222-2222-4222-8222-222222222202','55555555-5555-4555-8555-555555555503',NULL,'11111111-1111-4111-8111-111111111111',now() - interval '2 days',false),
 -- 404 Pending -> Assigned by Marta (admin)
 ('66666666-6666-4666-8666-666666666607','22222222-2222-4222-8222-222222222205','ServiceRequestStatusChanged','44444444-4444-4444-8444-444444444404','Pending','Assigned','22222222-2222-4222-8222-222222222201','55555555-5555-4555-8555-555555555504',now() - interval '10 days' + interval '2 hours','11111111-1111-4111-8111-111111111111',now() - interval '10 days' + interval '1 hour',false),
 ('66666666-6666-4666-8666-666666666608','22222222-2222-4222-8222-222222222203','ServiceRequestStatusChanged','44444444-4444-4444-8444-444444444404','Pending','Assigned','22222222-2222-4222-8222-222222222201','55555555-5555-4555-8555-555555555504',now() - interval '10 days' + interval '2 hours','11111111-1111-4111-8111-111111111111',now() - interval '10 days' + interval '1 hour',false),
 -- 404 Assigned -> InProgress by Anna (worker)
 ('66666666-6666-4666-8666-666666666609','22222222-2222-4222-8222-222222222205','ServiceRequestStatusChanged','44444444-4444-4444-8444-444444444404','Assigned','InProgress','22222222-2222-4222-8222-222222222203','55555555-5555-4555-8555-555555555505',now() - interval '10 days' + interval '5 hours','11111111-1111-4111-8111-111111111111',now() - interval '10 days' + interval '4 hours',false),
 ('66666666-6666-4666-8666-666666666610','22222222-2222-4222-8222-222222222201','ServiceRequestStatusChanged','44444444-4444-4444-8444-444444444404','Assigned','InProgress','22222222-2222-4222-8222-222222222203','55555555-5555-4555-8555-555555555505',now() - interval '10 days' + interval '5 hours','11111111-1111-4111-8111-111111111111',now() - interval '10 days' + interval '4 hours',false),
 -- 404 InProgress -> Completed by Anna (worker)
 ('66666666-6666-4666-8666-666666666611','22222222-2222-4222-8222-222222222205','ServiceRequestStatusChanged','44444444-4444-4444-8444-444444444404','InProgress','Completed','22222222-2222-4222-8222-222222222203','55555555-5555-4555-8555-555555555506',now() - interval '9 days' + interval '1 hour','11111111-1111-4111-8111-111111111111',now() - interval '9 days',false),
 ('66666666-6666-4666-8666-666666666612','22222222-2222-4222-8222-222222222201','ServiceRequestStatusChanged','44444444-4444-4444-8444-444444444404','InProgress','Completed','22222222-2222-4222-8222-222222222203','55555555-5555-4555-8555-555555555506',now() - interval '9 days' + interval '1 hour','11111111-1111-4111-8111-111111111111',now() - interval '9 days',false)
ON CONFLICT DO NOTHING;
