from __future__ import absolute_import
import pytest
import transaction

from nextgisweb.models import DBSession
from nextgisweb.auth import User

from nextgisweb.webmap.model import WebMap, WebMapItem

ANNOTATION_SAMPLE = dict(
    description='1', geom='POINT (0 0)',
    style=dict(string='string', int=0, bool=True, none=None)
)


@pytest.fixture(scope='module', autouse=True)
def enable_annotation(ngw_env):
    remember = ngw_env.webmap.options['annotation']
    ngw_env.webmap.options['annotation'] = True
    yield None
    ngw_env.webmap.options['annotation'] = remember


@pytest.fixture(scope='module')
def webmap(ngw_env):
    with transaction.manager:
        obj = WebMap(
            parent_id=0, display_name=__name__,
            owner_user=User.by_keyname('administrator'),
            root_item=WebMapItem(item_type='root')
        ).persist()
        DBSession.flush()
        DBSession.expunge(obj)

    yield obj

    with transaction.manager:
        DBSession.delete(WebMap.filter_by(id=obj.id).one())


def test_annotation_post_get(webmap, ngw_webtest_app, ngw_auth_administrator):
    result = ngw_webtest_app.post_json(
        '/api/resource/%d/annotation/' % webmap.id,
        ANNOTATION_SAMPLE)

    aid = result.json['id']
    assert aid > 0

    adata = ngw_webtest_app.get('/api/resource/%d/annotation/%d' % (webmap.id, aid)).json
    del adata['id']

    assert adata == ANNOTATION_SAMPLE
