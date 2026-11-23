-- Inserts the starting records only when the table is empty,
-- so running this file again never creates duplicates.
INSERT INTO records (title, category, description, status)
SELECT * FROM (VALUES
    ('Broken classroom light', 'Electrical',  'Light in Room B12 not working.',     'Pending'),
    ('Leaking tap in Lab',     'Plumbing',    'Tap in Science Lab is leaking.',     'In progress'),
    ('Damaged chair',          'Furniture',   'Chair in Room C3 is broken.',        'Completed'),
    ('Network outage',         'IT Support',  'Internet is down in the library.',   'In progress'),
    ('Projector not working',  'Electrical',  'Projector in Hall A not working.',   'Pending'),
    ('Clean litter area',      'Grounds',     'Lots of litter near Library.',       'Pending'),
    ('Air conditioner issue',  'HVAC',        'AC in Office 104 not cooling.',      'Completed'),
    ('Broken window',          'Maintenance', 'Window in Block B is broken.',       'In progress')
) AS starting (title, category, description, status)
WHERE NOT EXISTS (SELECT 1 FROM records);
