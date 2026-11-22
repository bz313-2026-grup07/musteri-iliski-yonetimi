/**
 * Rosebud CRM - ilk şema
 * Fizibilite raporu 3.2 (kapsam içi) ve 5.1 (zorunlu gereksinimler) baz alınmıştır.
 *
 * Şema değişikliği gerekirse BU DOSYAYI DEĞİŞTİRMEYİN; yeni migration açın:
 *   npm run migrate:make -- ekleme_aciklamasi
 */

exports.up = async function up(knex) {
  // Müşteri adı / firma / e-posta / telefon üzerinde hızlı "içinde geçen" araması için
  await knex.raw('CREATE EXTENSION IF NOT EXISTS pg_trgm');

  // ---------------------------------------------------------------- users
  await knex.schema.createTable('users', (t) => {
    t.increments('id');
    t.string('full_name', 120).notNullable();
    t.string('email', 160).notNullable().unique();
    t.string('password_hash').notNullable();
    // yonetim: her şey + kullanıcı yönetimi | satis: müşteri/görüşme/teklif | teknik: bilet/çağrı/aktarım
    t.string('role', 20).notNullable();
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamps(true, true);
  });
  await knex.raw(`ALTER TABLE users ADD CONSTRAINT users_role_chk CHECK (role IN ('yonetim','satis','teknik'))`);

  // ------------------------------------------------------------ customers
  await knex.schema.createTable('customers', (t) => {
    t.increments('id');
    // Eski platformdaki kimlik. Yeniden aktarımda mükerrer kayıt oluşmaması için UNIQUE (Fizibilite 5.4 veri bütünlüğü)
    t.string('source_id', 64).unique();
    t.string('name', 160).notNullable(); // ad soyad / unvan
    t.string('company', 200);
    t.string('email', 160);
    t.string('phone', 40);
    t.string('city', 80);
    t.text('address');
    t.text('description');
    t.integer('owner_id').references('users.id').onDelete('SET NULL'); // sorumlu temsilci
    t.timestamps(true, true);
  });
  await knex.raw('CREATE INDEX customers_name_trgm ON customers USING gin (name gin_trgm_ops)');
  await knex.raw('CREATE INDEX customers_company_trgm ON customers USING gin (company gin_trgm_ops)');
  await knex.raw('CREATE INDEX customers_email_trgm ON customers USING gin (email gin_trgm_ops)');
  await knex.raw('CREATE INDEX customers_phone_trgm ON customers USING gin (phone gin_trgm_ops)');

  // --------------------------------------------- interactions (görüşmeler)
  await knex.schema.createTable('interactions', (t) => {
    t.increments('id');
    t.integer('customer_id').notNullable().references('customers.id').onDelete('CASCADE');
    t.integer('user_id').references('users.id').onDelete('SET NULL'); // görüşmeyi yapan
    t.timestamp('occurred_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.string('channel', 20).notNullable().defaultTo('telefon');
    t.string('direction', 10); // gelen / giden
    t.integer('duration_sec');
    t.text('note');
    t.string('outcome', 200); // görüşme sonucu
    t.timestamp('follow_up_at', { useTz: true }); // isteğe bağlı: takip hatırlatması (5.2)
    t.timestamps(true, true);
    t.index(['customer_id', 'occurred_at']);
  });
  await knex.raw(`ALTER TABLE interactions ADD CONSTRAINT interactions_channel_chk CHECK (channel IN ('telefon','eposta','toplanti','diger'))`);
  await knex.raw(`ALTER TABLE interactions ADD CONSTRAINT interactions_direction_chk CHECK (direction IS NULL OR direction IN ('gelen','giden'))`);

  // ----------------------------------------------------- offers (teklifler)
  await knex.schema.createTable('offers', (t) => {
    t.increments('id');
    t.integer('customer_id').notNullable().references('customers.id').onDelete('CASCADE');
    t.integer('user_id').references('users.id').onDelete('SET NULL');
    t.string('title', 200).notNullable();
    t.text('scope');
    t.decimal('amount', 14, 2).notNullable().defaultTo(0);
    t.string('currency', 3).notNullable().defaultTo('TRY');
    t.date('offer_date').notNullable().defaultTo(knex.fn.now());
    t.string('status', 20).notNullable().defaultTo('hazirlandi');
    t.timestamps(true, true);
    t.index(['customer_id']);
    t.index(['status']);
  });
  await knex.raw(`ALTER TABLE offers ADD CONSTRAINT offers_status_chk CHECK (status IN ('hazirlandi','sunuldu','onaylandi','reddedildi'))`);

  // ------------------------------------------------- tickets (destek biletleri)
  await knex.raw('CREATE SEQUENCE ticket_no_seq START 1');
  await knex.schema.createTable('tickets', (t) => {
    t.increments('id');
    t.string('ticket_no', 20).notNullable().unique()
      .defaultTo(knex.raw(`'TKT-' || lpad(nextval('ticket_no_seq')::text, 6, '0')`));
    t.integer('customer_id').notNullable().references('customers.id').onDelete('CASCADE');
    t.integer('created_by').references('users.id').onDelete('SET NULL');
    t.integer('assigned_to').references('users.id').onDelete('SET NULL');
    t.string('subject', 200).notNullable();
    t.string('category', 20).notNullable().defaultTo('teknik_destek');
    t.string('status', 20).notNullable().defaultTo('acik');
    t.timestamp('closed_at', { useTz: true });
    t.timestamps(true, true);
    t.index(['customer_id']);
    t.index(['status']);
    t.index(['created_at']);
  });
  await knex.raw(`ALTER TABLE tickets ADD CONSTRAINT tickets_category_chk CHECK (category IN ('teknik_destek','talep','proje'))`);
  await knex.raw(`ALTER TABLE tickets ADD CONSTRAINT tickets_status_chk CHECK (status IN ('acik','cevap_bekleniyor','tamamlandi'))`);

  await knex.schema.createTable('ticket_messages', (t) => {
    t.increments('id');
    t.integer('ticket_id').notNullable().references('tickets.id').onDelete('CASCADE');
    t.integer('user_id').references('users.id').onDelete('SET NULL');
    t.text('body').notNullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index(['ticket_id', 'created_at']);
  });

  await knex.schema.createTable('attachments', (t) => {
    t.increments('id');
    t.integer('ticket_id').notNullable().references('tickets.id').onDelete('CASCADE');
    t.integer('message_id').references('ticket_messages.id').onDelete('SET NULL');
    t.string('original_name', 255).notNullable();
    t.string('stored_name', 255).notNullable(); // diskteki rastgele ad
    t.string('mime_type', 100).notNullable();
    t.integer('size_bytes').notNullable();
    t.integer('uploaded_by').references('users.id').onDelete('SET NULL');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  // --------------------------------------------- import_jobs / import_errors
  await knex.schema.createTable('import_jobs', (t) => {
    t.increments('id');
    t.string('type', 20).notNullable(); // customers / calls
    t.string('file_name', 255);
    t.string('status', 20).notNullable().defaultTo('running');
    t.integer('total_rows').notNullable().defaultTo(0);
    t.integer('success_rows').notNullable().defaultTo(0);
    t.integer('failed_rows').notNullable().defaultTo(0);
    t.integer('started_by').references('users.id').onDelete('SET NULL');
    t.timestamp('started_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('finished_at', { useTz: true });
  });
  await knex.raw(`ALTER TABLE import_jobs ADD CONSTRAINT import_jobs_type_chk CHECK (type IN ('customers','calls'))`);
  await knex.raw(`ALTER TABLE import_jobs ADD CONSTRAINT import_jobs_status_chk CHECK (status IN ('running','completed','failed'))`);

  await knex.schema.createTable('import_errors', (t) => {
    t.increments('id');
    t.integer('job_id').notNullable().references('import_jobs.id').onDelete('CASCADE');
    t.integer('row_number').notNullable();
    t.jsonb('raw');
    t.string('reason', 500).notNullable();
    t.index(['job_id']);
  });

  // ----------------------------------------------------- calls (çağrı verisi, CSV)
  await knex.schema.createTable('calls', (t) => {
    t.increments('id');
    t.string('external_id', 64).unique(); // CSV'de varsa: yeniden aktarımda tekrar etmesin
    t.timestamp('call_at', { useTz: true }).notNullable();
    t.string('direction', 10).notNullable();
    t.integer('duration_sec').notNullable().defaultTo(0);
    t.integer('agent_id').references('users.id').onDelete('SET NULL'); // temsilci
    t.integer('customer_id').references('customers.id').onDelete('SET NULL');
    t.string('phone', 40);
    t.integer('import_job_id').references('import_jobs.id').onDelete('SET NULL');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    // Fizibilite 6.2 PoC: tarih ve temsilci indeksleri dashboard için yeterli bulundu
    t.index(['call_at']);
    t.index(['agent_id', 'call_at']);
  });
  await knex.raw(`ALTER TABLE calls ADD CONSTRAINT calls_direction_chk CHECK (direction IN ('gelen','giden'))`);

  // ---------------------------------------------------------- audit_logs
  await knex.schema.createTable('audit_logs', (t) => {
    t.bigIncrements('id');
    t.integer('user_id').references('users.id').onDelete('SET NULL');
    t.string('action', 40).notNullable(); // create / update / delete / login / import
    t.string('entity', 40).notNullable();
    t.string('entity_id', 64);
    t.jsonb('meta');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index(['entity', 'entity_id']);
  });
};

exports.down = async function down(knex) {
  await knex.schema
    .dropTableIfExists('audit_logs')
    .dropTableIfExists('calls')
    .dropTableIfExists('import_errors')
    .dropTableIfExists('import_jobs')
    .dropTableIfExists('attachments')
    .dropTableIfExists('ticket_messages')
    .dropTableIfExists('tickets')
    .dropTableIfExists('offers')
    .dropTableIfExists('interactions')
    .dropTableIfExists('customers')
    .dropTableIfExists('users');
  await knex.raw('DROP SEQUENCE IF EXISTS ticket_no_seq');
};
