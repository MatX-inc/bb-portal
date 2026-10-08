// Probe for the gcpiam driver: opens GCPIAM_PROBE_DSN through otelsql as
// bb-portal does, then checks identity, a read, and a denied write.
package main

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/buildbarn/bb-portal/internal/database/gcpiam"

	"github.com/uptrace/opentelemetry-go-extra/otelsql"
)

func main() {
	dsn := os.Getenv("GCPIAM_PROBE_DSN")
	if dsn == "" {
		fmt.Fprintln(os.Stderr, "GCPIAM_PROBE_DSN is not set")
		os.Exit(2)
	}
	db, err := otelsql.Open(gcpiam.DriverName, dsn)
	if err != nil {
		fmt.Fprintln(os.Stderr, "open:", err)
		os.Exit(1)
	}
	defer db.Close()
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	var sessionUser, currentUser string
	if err := db.QueryRowContext(ctx, "SELECT session_user, current_user").Scan(&sessionUser, &currentUser); err != nil {
		fmt.Fprintln(os.Stderr, "identity query:", err)
		os.Exit(1)
	}
	fmt.Printf("session_user=%s current_user=%s\n", sessionUser, currentUser)

	var tables, readable int
	err = db.QueryRowContext(ctx, `SELECT count(*),
		count(*) FILTER (WHERE has_table_privilege(current_user, schemaname || '.' || tablename, 'SELECT'))
		FROM pg_tables WHERE schemaname = 'public'`).Scan(&tables, &readable)
	if err != nil {
		fmt.Fprintln(os.Stderr, "privilege query:", err)
		os.Exit(1)
	}
	fmt.Printf("public tables=%d readable=%d\n", tables, readable)

	var n int
	if err := db.QueryRowContext(ctx, "SELECT count(*) FROM action_cache_statistics").Scan(&n); err != nil {
		fmt.Fprintln(os.Stderr, "read probe:", err)
		os.Exit(1)
	}
	fmt.Printf("action_cache_statistics rows=%d\n", n)

	if _, err := db.ExecContext(ctx, "CREATE TABLE gcpiam_probe_should_fail (x int)"); err == nil {
		fmt.Fprintln(os.Stderr, "write probe: CREATE TABLE succeeded, role is not read-only")
		os.Exit(1)
	} else {
		fmt.Printf("write probe denied as expected: %v\n", err)
	}

	// Forces a second connection through the hook.
	db.SetMaxIdleConns(0)
	if err := db.PingContext(ctx); err != nil {
		fmt.Fprintln(os.Stderr, "reconnect ping:", err)
		os.Exit(1)
	}
	fmt.Println("reconnect ok")
}
