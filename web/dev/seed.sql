-- Demo data for LIVE mode (PostgreSQL from docker-compose, DB FixItDb).
-- Usage: psql "host=localhost port=5433 dbname=FixItDb user=postgres password=postgres" -f web/dev/seed.sql
-- Enums are stored as strings (EF HasConversion<string>). Passwords are not verified by the backend yet.

INSERT INTO "Tenants" ("Id","Name","Description","IsActive","TenantId","CreatedAt","IsDeleted") VALUES
 ('11111111-1111-4111-8111-111111111111','Hydro-Serwis Nowak','Plumbing, heating & HVAC services','true','11111111-1111-4111-8111-111111111111',now(),false)
ON CONFLICT DO NOTHING;

INSERT INTO "Users" ("Id","Email","FirstName","LastName","Role","IsActive","TenantId","CreatedAt","IsDeleted") VALUES
 ('22222222-2222-4222-8222-222222222201','marta.nowak@hydro-serwis.pl','Marta','Nowak','Admin',true,'11111111-1111-4111-8111-111111111111',now(),false),
 ('22222222-2222-4222-8222-222222222202','tomasz.kowalczyk@hydro-serwis.pl','Tomasz','Kowalczyk','Worker',true,'11111111-1111-4111-8111-111111111111',now(),false),
 ('22222222-2222-4222-8222-222222222203','anna.wisniewska@hydro-serwis.pl','Anna','Wiśniewska','Worker',true,'11111111-1111-4111-8111-111111111111',now(),false),
 ('22222222-2222-4222-8222-222222222204','bartosz.jankowski@gmail.com','Bartosz','Jankowski','Customer',true,'11111111-1111-4111-8111-111111111111',now(),false),
 ('22222222-2222-4222-8222-222222222205','katarzyna.jablonska@gmail.com','Katarzyna','Jabłońska','Customer',true,'11111111-1111-4111-8111-111111111111',now(),false)
ON CONFLICT DO NOTHING;

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
