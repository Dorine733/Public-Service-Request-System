-- OPTIONAL demo data. Register at least one account first, then run this.
-- Adds sample requests (various statuses) owned by the earliest registered user.
insert into requests (user_id, category, location, description, status, latitude, longitude, admin_note)
select p.id, v.category, v.location, v.description, v.status, v.lat, v.lng, v.note
from (select id from profiles order by created_at limit 1) p,
(values
 ('Streetlight','Murang''a Town, Kenyatta Avenue','Streetlight outside the Equity branch has been off for a week.','Pending',-0.7210,37.1526,null::text),
 ('Water Issue','Kenol Market','Burst water pipe flooding the road near the market entrance.','In Progress',-0.9050,37.0150,'Plumbing crew dispatched.'),
 ('Garbage Collection','Kangari Stage','Garbage has not been collected for two weeks.','Resolved',-0.8300,37.0600,'Collected and schedule restored.'),
 ('Road Damage','Maragua Road','Large pothole causing accidents near the junction.','Pending',-0.7800,37.1400,null::text),
 ('Sewage','Kiria-ini','Blocked sewer line overflowing near the dispensary.','In Progress',-0.7000,37.1000,'Inspection scheduled.')
) as v(category, location, description, status, lat, lng, note);
