/**
 * Copyright 2010-2015 Three Crickets LLC.
 * <p>
 * The contents of this file are subject to the terms of the Apache License
 * version 2.0: http://www.opensource.org/licenses/apache2.0.php
 * <p>
 * Alternatively, you can obtain a royalty free commercial license with less
 * limitations, transferable or non-transferable, directly from Three Crickets
 * at http://threecrickets.com/
 */

package org.bson.jvm.rhino;

import org.bson.BsonReader;
import org.bson.BsonWriter;
import org.bson.codecs.Codec;
import org.bson.codecs.DecoderContext;
import org.bson.codecs.EncoderContext;
import org.bson.codecs.configuration.CodecRegistry;
import org.mozilla.javascript.Wrapper;

/**
 * A BSON codec for a Rhino {@link Wrapper}.
 * 
 * @author Tal Liron
 */
public class WrapperCodec implements Codec<Wrapper>
{
	//
	// Construction
	//

	public WrapperCodec( CodecRegistry codecRegistry )
	{
		this.codecRegistry = codecRegistry;
	}

	//
	// Codec
	//

	public Class<Wrapper> getEncoderClass()
	{
		return Wrapper.class;
	}

	public void encode( BsonWriter writer, Wrapper wrapper, EncoderContext encoderContext )
	{
		Object object = wrapper.unwrap();

		@SuppressWarnings("unchecked")
		Codec<Object> codec = (Codec<Object>) codecRegistry.get( object.getClass() );
		codec.encode( writer, object, encoderContext );
	}

	public Wrapper decode( BsonReader reader, DecoderContext decoderContext )
	{
		throw new UnsupportedOperationException( WrapperCodec.class.getCanonicalName() + ".decode" );
	}

	// //////////////////////////////////////////////////////////////////////////
	// Private

	private final CodecRegistry codecRegistry;
}
