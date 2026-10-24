CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS furniture_items (
  key TEXT PRIMARY KEY, name TEXT NOT NULL, emoji TEXT NOT NULL, category TEXT NOT NULL, price INT NOT NULL, tag TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS challenges (
  id SERIAL PRIMARY KEY, title TEXT UNIQUE NOT NULL, description TEXT NOT NULL, budget INT NOT NULL, required JSONB NOT NULL);
CREATE TABLE IF NOT EXISTS rooms (
  id SERIAL PRIMARY KEY, user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, theme TEXT NOT NULL DEFAULT 'lavender', wallpaper TEXT NOT NULL, floor_color TEXT NOT NULL,
  floor_pattern TEXT NOT NULL DEFAULT 'planks', challenge_id INT REFERENCES challenges(id),
  objects JSONB NOT NULL DEFAULT '[]', updated_at TIMESTAMPTZ DEFAULT now());
CREATE INDEX IF NOT EXISTS rooms_user_idx ON rooms(user_id);

INSERT INTO furniture_items (key,name,emoji,category,price,tag) VALUES
('bed','Single bed','🛏️','furniture',300,'bed'),('sofa','Sofa','🛋️','furniture',250,'sofa'),
('desk','Study desk','🖥️','furniture',150,'desk'),('chair','Chair','🪑','furniture',60,'chair'),
('bookshelf','Bookshelf','📚','furniture',120,'bookshelf'),('floorlamp','Floor lamp','💡','lighting',40,'lamp'),
('desklamp','Desk lamp','🔦','lighting',25,'lamp'),('candle','Candle','🕯️','lighting',10,'lamp'),
('plant','Potted plant','🪴','plants',30,'plant'),('cactus','Cactus','🌵','plants',15,'plant'),
('flowers','Tulips','🌷','plants',12,'plant'),('rug','Yarn rug','🧶','rugs',50,'rug'),
('painting','Painting','🖼️','wall art',45,'art'),('clock','Wall clock','🕰️','wall art',35,'decor'),
('mirror','Mirror','🪞','wall art',70,'decor'),('window','Window','🪟','wall art',90,'decor'),
('cat','Cat','🐈','extras',20,'pet'),('teddy','Teddy bear','🧸','extras',18,'decor'),
('tv','Television','📺','extras',200,'tv'),('coffee','Hot cocoa','☕','extras',8,'decor')
ON CONFLICT DO NOTHING;
INSERT INTO challenges (title,description,budget,required) VALUES
('Cozy student bedroom','A bed, a desk and a lamp – with a plant for good vibes.',600,'{"bed":1,"desk":1,"lamp":1,"plant":1}'),
('Reading corner','A chair, a bookshelf, a lamp and a soft rug.',350,'{"chair":1,"bookshelf":1,"lamp":1,"rug":1}'),
('Plant lover''s nook','Three plants and somewhere to sit.',250,'{"plant":3,"chair":1}'),
('Movie night living room','Sofa, TV and rug – keep it under budget.',650,'{"sofa":1,"tv":1,"rug":1}')
ON CONFLICT DO NOTHING;
