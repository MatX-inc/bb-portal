// Package gcpiam registers a database/sql driver that authenticates pgx
// connections to Cloud SQL with Google Cloud IAM access tokens instead
// of a password. MatX-carried; kept separate so the upstream diff stays
// at the choice of driver name.
package gcpiam

import (
	"context"
	"database/sql"
	"database/sql/driver"

	"github.com/buildbarn/bb-storage/pkg/util"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/stdlib"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

// DriverName selects this driver in sql.Open and otelsql.Open. The data
// source name is an ordinary pgx connection string without a password.
const DriverName = "pgx-gcpiam"

// Narrower than cloud-platform: the token is good only for Cloud SQL login.
const sqlLoginScope = "https://www.googleapis.com/auth/sqlservice.login"

func init() {
	sql.Register(DriverName, tokenDriver{})
}

// A DriverContext, so one connector and one token source serve every
// connection of a sql.DB.
type tokenDriver struct{}

func (tokenDriver) Open(name string) (driver.Conn, error) {
	connector, err := tokenDriver{}.OpenConnector(name)
	if err != nil {
		return nil, err
	}
	return connector.Connect(context.Background())
}

func (tokenDriver) OpenConnector(name string) (driver.Connector, error) {
	connConfig, err := pgx.ParseConfig(name)
	if err != nil {
		return nil, util.StatusWrap(err, "Failed to parse postgres connection string")
	}
	tokenSource, err := google.DefaultTokenSource(context.Background(), sqlLoginScope)
	if err != nil {
		return nil, util.StatusWrap(err, "Failed to obtain Google Cloud credentials for database login")
	}
	return connector{stdlib.GetConnector(*connConfig, stdlib.OptionBeforeConnect(passwordFromToken(tokenSource)))}, nil
}

// otelsql.Open reopens through the driver the connector reports. pgx's
// connector reports pgx's own driver, which has no hook.
type connector struct {
	driver.Connector
}

func (connector) Driver() driver.Driver {
	return tokenDriver{}
}

// Postgres authenticates only at connect time, so established
// connections outlive the token that opened them.
func passwordFromToken(tokenSource oauth2.TokenSource) func(context.Context, *pgx.ConnConfig) error {
	return func(ctx context.Context, connConfig *pgx.ConnConfig) error {
		token, err := tokenSource.Token()
		if err != nil {
			return util.StatusWrap(err, "Failed to obtain Google Cloud access token for database login")
		}
		connConfig.Password = token.AccessToken
		return nil
	}
}
